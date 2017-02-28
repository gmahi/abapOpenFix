class ZCL_AOF_CODE_INSPECTOR definition
  public
  create public .

public section.

  class-methods RUN
    importing
      !IV_VARIANT type SCI_CHKV
      !IV_OBJECT_SET type SCI_OBJS
    returning
      value(RT_RESULTS) type SCIT_ALVLIST .
  class-methods RUN_OBJECT
    importing
      !IV_VARIANT type SCI_CHKV
      !IV_OBJTYPE type SCI_TYPID
      !IV_OBJNAME type SOBJ_NAME
    returning
      value(RT_RESULTS) type SCIT_ALVLIST .
protected section.

  class-methods CREATE_AND_RUN
    importing
      !IO_VARIANT type ref to CL_CI_CHECKVARIANT
      !IO_OBJECT_SET type ref to CL_CI_OBJECTSET
    returning
      value(RO_INSPECTION) type ref to CL_CI_INSPECTION .
  class-methods RESULTS
    importing
      !IO_INSPECTION type ref to CL_CI_INSPECTION
    returning
      value(RT_RESULTS) type SCIT_ALVLIST .
  class-methods GET_OBJECT_SET
    importing
      !IV_OBJECTSET type SCI_OBJS
    returning
      value(RO_OBJECTSET) type ref to CL_CI_OBJECTSET .
  class-methods GET_SINGLE_OBJECT
    importing
      !IV_OBJTYPE type SCI_TYPID
      !IV_OBJNAME type SOBJ_NAME
    returning
      value(RO_OBJECTSET) type ref to CL_CI_OBJECTSET .
  class-methods GET_VARIANT
    importing
      !IV_VARIANT type SCI_CHKV
    returning
      value(RO_VARIANT) type ref to CL_CI_CHECKVARIANT .
private section.
ENDCLASS.



CLASS ZCL_AOF_CODE_INSPECTOR IMPLEMENTATION.


  METHOD create_and_run.

    cl_ci_inspection=>create(
      EXPORTING
        p_user           = ''
        p_name           = 'ABAPOPENFIX'
      RECEIVING
        p_ref            = ro_inspection
      EXCEPTIONS
        locked           = 1
        error_in_enqueue = 2
        not_authorized   = 3
        OTHERS           = 4 ).                           "#EC CI_SUBRC
    ASSERT sy-subrc = 0.

    ro_inspection->set(
      p_chkv    = io_variant
      p_objs    = io_object_set
      p_text    = text-001
      p_deldate = sy-datum ).

    ro_inspection->run(
      EXPORTING
        p_howtorun            = 'L' " parallel local server
      EXCEPTIONS
        invalid_check_version = 1
        OTHERS                = 2 ).                      "#EC CI_SUBRC
    ASSERT sy-subrc = 0.

  ENDMETHOD.


  METHOD get_object_set.

    cl_ci_objectset=>get_ref(
      EXPORTING
        p_objsnam                 = iv_objectset
      RECEIVING
        p_ref                     = ro_objectset
      EXCEPTIONS
        missing_parameter         = 1
        objs_not_exists           = 2
        invalid_request           = 3
        object_not_exists         = 4
        object_may_not_be_checked = 5
        no_main_program           = 6
        OTHERS                    = 7 ).                  "#EC CI_SUBRC
    ASSERT sy-subrc = 0.

  ENDMETHOD.


  METHOD get_single_object.

    DATA: lt_objects TYPE scit_objs.

    FIELD-SYMBOLS: <ls_object> LIKE LINE OF lt_objects.


    APPEND INITIAL LINE TO lt_objects ASSIGNING <ls_object>.
    <ls_object>-objtype = iv_objtype.
    <ls_object>-objname = iv_objname.

    cl_ci_objectset=>save_from_list(
      EXPORTING
        p_user              = ''
        p_objects           = lt_objects
      RECEIVING
        p_ref               = ro_objectset
      EXCEPTIONS
        objs_already_exists = 1
        locked              = 2
        error_in_enqueue    = 3
        not_authorized      = 4
        OTHERS              = 5 ).
    ASSERT sy-subrc = 0.

  ENDMETHOD.


  METHOD get_variant.

* variant must be global
    cl_ci_checkvariant=>get_ref(
      EXPORTING
        p_user            = ''
        p_name            = iv_variant
      RECEIVING
        p_ref             = ro_variant
      EXCEPTIONS
        chkv_not_exists   = 1
        missing_parameter = 2
        OTHERS            = 3 ).                          "#EC CI_SUBRC
    ASSERT sy-subrc = 0.

  ENDMETHOD.


  METHOD results.

* make sure sap note 2043027 is installed
    io_inspection->plain_list(
      IMPORTING
        p_list = rt_results ).

    DELETE rt_results WHERE objtype = 'STAT'.

  ENDMETHOD.


  METHOD run.

    DATA: lo_variant    TYPE REF TO cl_ci_checkvariant,
          lo_ci         TYPE REF TO cl_ci_inspection,
          lo_object_set TYPE REF TO cl_ci_objectset.


    lo_variant = get_variant( iv_variant ).

    lo_object_set = get_object_set( iv_object_set ).

    lo_ci = create_and_run(
      io_variant    = lo_variant
      io_object_set = lo_object_set ).

* make sure SAP note 2043027 is installed
    lo_ci->plain_list(
      IMPORTING
        p_list = rt_results ).

    DELETE rt_results WHERE objtype = 'STAT'.

  ENDMETHOD.


  METHOD run_object.

    DATA: lo_variant    TYPE REF TO cl_ci_checkvariant,
          lo_ci         TYPE REF TO cl_ci_inspection,
          lo_object_set TYPE REF TO cl_ci_objectset.


    lo_variant = get_variant( iv_variant ).

    lo_object_set = get_single_object(
      iv_objtype = iv_objtype
      iv_objname = iv_objname ).

    lo_ci = create_and_run(
      io_variant    = lo_variant
      io_object_set = lo_object_set ).

    rt_results = results( lo_ci ).

  ENDMETHOD.
ENDCLASS.
